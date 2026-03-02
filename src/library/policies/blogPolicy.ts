interface Props {
  slug?: string;
  imageUrl?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  published?: boolean | string;
}

export default function blogPolicy(props: Props): API.Success | API.Failure {
  try {
    const { slug, imageUrl, title, excerpt, content, published } = props;
    const validatedData: Partial<Props> = {};

    // Validate Slug
    if (slug !== undefined) {
      if (typeof slug !== 'string' || slug.trim() === '') {
        return {
          ok: false,
          error: {
            message: 'Slug must be a non-empty string.',
            origin: 'policies',
            method: 'blogPolicy',
            field: 'slug',
          },
        };
      }
      validatedData.slug = slug.trim();
    }

    // Validate Image URL
    if (imageUrl !== undefined) {
      if (typeof imageUrl !== 'string') {
        // Allow empty string? Maybe.
        return {
          ok: false,
          error: {
            message: 'Image URL must be a string.',
            origin: 'policies',
            method: 'blogPolicy',
            field: 'imageUrl',
          },
        };
      }
      validatedData.imageUrl = imageUrl.trim();
    }

    // Validate Title
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return {
          ok: false,
          error: {
            message: 'Title must be a non-empty string.',
            origin: 'policies',
            method: 'blogPolicy',
            field: 'title',
          },
        };
      }
      validatedData.title = title.trim();
    }

    // Validate Excerpt
    if (excerpt !== undefined) {
      if (typeof excerpt !== 'string') {
        return {
          ok: false,
          error: {
            message: 'Excerpt must be a string.',
            origin: 'policies',
            method: 'blogPolicy',
            field: 'excerpt',
          },
        };
      }
      validatedData.excerpt = excerpt.trim();
    }

    // Validate Content
    if (content !== undefined) {
      if (typeof content !== 'string') {
        return {
          ok: false,
          error: {
            message: 'Content must be a string.',
            origin: 'policies',
            method: 'blogPolicy',
            field: 'content',
          },
        };
      }
      validatedData.content = content.trim(); // Content might need to preserve formatting, but trim is usually safe for start/end
    }

    // Validate Published
    if (published !== undefined) {
      if (typeof published === 'boolean') {
        validatedData.published = published;
      } else if (typeof published === 'string') {
        const lower = published.toLowerCase().trim();
        if (lower === 'true') validatedData.published = true;
        else if (lower === 'false') validatedData.published = false;
        else {
          return {
            ok: false,
            error: {
              message: 'Published must be a boolean or "true"/"false".',
              origin: 'policies',
              method: 'blogPolicy',
              field: 'published',
            },
          };
        }
      } else {
        return {
          ok: false,
          error: {
            message: 'Published must be a boolean.',
            origin: 'policies',
            method: 'blogPolicy',
            field: 'published',
          },
        };
      }
    }

    return {
      ok: true,
      data: validatedData,
    };
  } catch (e: unknown) {
    const error = e as Error;
    return {
      ok: false,
      error: {
        message: 'Unable to enforce blog policy.',
        origin: 'policies',
        method: 'blogPolicy',
        raw: {
          name: error.name,
          message: error.message,
        },
      },
    };
  }
}
