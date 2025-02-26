import { FetchResultFees, SimpleAdapter } from "../adapters/types";
import * as sdk from "@defillama/sdk";
import { CHAIN } from "../helpers/chains";
import { ethers } from "ethers";
import { getBlock } from "../helpers/getBlock";

const address = '0x82ac2ce43e33683c58be4cdc40975e73aa50f459';
const topic0_position_change = '0x968bc4f738eae0486dc6736c4b427dbafa4acfdf6eaf223337791ddeb3a56247'
const event_postion_change = 'event PositionChanged(address indexed trader,address indexed baseToken,int256 exchangedPositionSize,int256 exchangedPositionNotional,uint256 fee,int256 openNotional,int256 realizedPnl,uint256 sqrtPriceAfterX96)';
const contract_interface = new ethers.utils.Interface([
  event_postion_change,
]);

interface ILog {
  data: string;
  transactionHash: string;
  topics: string[];
}

const fetchFees = async (timestamp: number): Promise<FetchResultFees> => {
  const toTimestamp = timestamp
  const fromTimestamp = timestamp - 60 * 60 * 24
  try {
    const fromBlock = (await getBlock(fromTimestamp, CHAIN.OPTIMISM, {}))
    const toBlock =   (await getBlock(toTimestamp, CHAIN.OPTIMISM, {}))
    const logs_position_chnage: ILog[] = (await sdk.api.util.getLogs({
      target: address,
      topic: '',
      keys: [],
      topics: [topic0_position_change],
      toBlock: toBlock,
      fromBlock: fromBlock,
      chain: CHAIN.OPTIMISM
    })).output as ILog[];


    const fees_details = logs_position_chnage.map((e: ILog) => {
      const value = contract_interface.parseLog(e);
      return Number(value.args.fee._hex) / 10 ** 18;
    }).reduce((a: number, b: number) => a + b, 0)

    const dailyFees = fees_details
    const dailyRevenue = dailyFees * 0.2;
    const dailySupplySideRevenue = dailyFees * 0.8;
    return {
      dailyFees: `${dailyFees}`,
      dailyRevenue: `${dailyRevenue}`,
      dailySupplySideRevenue: `${dailySupplySideRevenue}`,
      timestamp
    }
  } catch (error) {
    console.error(error)
    throw error;
  }
}

const adapters: SimpleAdapter = {
  adapter: {
    [CHAIN.OPTIMISM]: {
      fetch: fetchFees,
      start: async () => 1672531200
    }
  }
}
export default adapters;
