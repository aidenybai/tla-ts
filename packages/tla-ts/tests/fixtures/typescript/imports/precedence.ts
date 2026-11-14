import { LOWEST, PRECEDENCES } from "./precedences";

const getPrecedence = (operator: string) => PRECEDENCES.get(operator);
const getTotal = (operators: string[]): number =>
  operators.length === 0
    ? 0
    : (getPrecedence(operators[0])?.high ?? 0) + getTotal(operators.slice(1));
if (getPrecedence("=>") !== LOWEST || getTotal(["=>", "#"]) !== 6) throw new Error("precedence");
