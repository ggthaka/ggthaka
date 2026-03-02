import { countries } from '@library/json';

interface Props {
  country: string;
  returnFieldName: string | null;
}

const getLevenshteinDistance = (value: string, target: string) => {
  const rows = value.length + 1;
  const cols = target.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(0),
  );

  for (let i = 0; i < rows; i += 1) {
    matrix[i][0] = i;
  }

  for (let j = 0; j < cols; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = value[i - 1] === target[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[rows - 1][cols - 1];
};

const getClosestCountryMatch = (value: string) => {
  const normalizedValue = value.toLocaleLowerCase();
  let closestMatch = '';
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const item of countries) {
    const normalizedItem = item.toLocaleLowerCase();
    const distance = getLevenshteinDistance(normalizedValue, normalizedItem);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestMatch = item;
    }
  }

  const longestLength = Math.max(normalizedValue.length, closestMatch.length);
  const similarity =
    longestLength === 0 ? 0 : 1 - closestDistance / longestLength;

  return {
    closestMatch,
    similarity,
  };
};

export default function countryPolicy({
  country,
  returnFieldName,
}: Props): API.Success | API.Failure {
  try {
    const normalizedCountry = country?.trim();

    if (!normalizedCountry) {
      return {
        ok: false,
        error: {
          message:
            'Kindly ensure that the country field is not left empty in order to proceed.',
          origin: 'policies',
          method: 'countryPolicy',
          field: returnFieldName,
        },
      };
    }

    const matchedCountry = countries.find(
      (item) =>
        item.toLocaleLowerCase() === normalizedCountry.toLocaleLowerCase(),
    );

    if (!matchedCountry) {
      const { closestMatch, similarity } =
        getClosestCountryMatch(normalizedCountry);

      if (closestMatch && similarity >= 0.75) {
        return {
          ok: false,
          error: {
            message: `Did you mean "${closestMatch}"? Please enter the correct country name.`,
            origin: 'policies',
            method: 'countryPolicy',
            field: returnFieldName,
          },
        };
      }

      return {
        ok: false,
        error: {
          message:
            'Please provide a valid country name from the list of recognized countries.',
          origin: 'policies',
          method: 'countryPolicy',
          field: returnFieldName,
        },
      };
    }

    return {
      ok: true,
      data: { country: matchedCountry },
    };
  } catch (e: unknown) {
    const error = e as Error;
    return {
      ok: false,
      error: {
        message: 'Unable to enforce country policy.',
        origin: 'policies',
        method: 'countryPolicy',
        field: returnFieldName,
        raw: {
          name: error.name,
          message: error.message,
        },
      },
    };
  }
}
