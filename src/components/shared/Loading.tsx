import { LoadingStyles } from '@styles/shared';

export default function Loading() {
  return (
    <div className={LoadingStyles.Loading}>
      <span className={LoadingStyles.Loader}></span>
    </div>
  );
}
