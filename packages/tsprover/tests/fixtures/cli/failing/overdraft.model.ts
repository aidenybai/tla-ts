type Account = "alice" | "bob";

let balances: Record<Account, number> = { alice: 2, bob: 2 };

export const transfer = (from: Account, to: Account) => {
  balances[from] -= 2;
  balances[to] += 2;
};

export const noOverdraft = () => balances.alice >= 0 && balances.bob >= 0;
