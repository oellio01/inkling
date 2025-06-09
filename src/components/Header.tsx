import { formatTimeInSeconds } from "./formatTimeInSeconds";

export function Header({
  onClickInfo,
  timerInSeconds,
}: {
  onClickInfo: () => void;
  timerInSeconds: number;
}) {
  const { minutes, seconds } = formatTimeInSeconds(timerInSeconds);

  return (
    <div className="flex flex-col">
      <div className="flex justify-end p-4 items-center text-gray-400">
        <div className="flex">
          <div className="w-10 tracking-wider text-right">{minutes}</div>
          <div className="mx-0.5">:</div>
          <div className="w-10 tracking-wider">{seconds}</div>
        </div>
        <button
          className="border border-gray-500 size-5 flex justify-center items-center text-sm font-mono cursor-pointer hover:bg-gray-700/40"
          onClick={onClickInfo}
        >
          i
        </button>
      </div>
    </div>
  );
}
