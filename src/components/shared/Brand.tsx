import { Icon } from '@components/shared';
import { BrandStyles } from '@styles/shared';

export default function Brand() {
  return (
    <div className={BrandStyles.Brand}>
      <Icon
        name='logo'
        alt='Logo Icon'
        size={28}
      />
      <p>ggthaka</p>
    </div>
  );
}
