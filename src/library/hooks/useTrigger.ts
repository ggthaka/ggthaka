import { useState } from 'react';

type Trigger = boolean;

export default function useTrigger() {
  const [trigger, setTrigger] = useState<Trigger>(false);

  const pullTrigger = () => {
    setTrigger(!trigger);
  };

  return { trigger, setTrigger, pullTrigger };
}
