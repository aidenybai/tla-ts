---- MODULE OperatorValues ----
EXTENDS Naturals, FiniteSets, TLC
VARIABLE x
Step(F(_)) == x < 3 /\ x' = F(x)
Inc(y) == y + 1
Init == x = 0
Next == Step(Inc)
HasOp == "context" \in DOMAIN TLCGet("action")
Op == TLCGet("action").context.F
EqualsNumber == HasOp => Op = 1
EqualsItself == HasOp => TLCGet("action") = TLCGet("action")
Compares == HasOp => {Op, Op} # {}
HasMember == HasOp => 1 \in Op
Applies == HasOp => Op[1] = 2
HasDomain == HasOp => DOMAIN Op = {}
Prints == HasOp => PrintT(Op)
Shows == HasOp => ToString(Op) = "<Operator Inc>"
IsFinite == HasOp => IsFiniteSet(Op)
Counts == HasOp => Cardinality(Op) = 0
Subsets == HasOp => SUBSET Op = {}
Pairs == HasOp => (Op \X {1}) = {}
Maps == HasOp => [Op -> {1}] = {}
Filters == HasOp => {e \in Op : TRUE} = {}
Removes == HasOp => (Op \ {1}) = {}
====
