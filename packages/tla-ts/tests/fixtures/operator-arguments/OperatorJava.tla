---- MODULE OperatorJava ----
EXTENDS Naturals, Sequences, TLC
VARIABLE x
Step(F(_)) == x < 3 /\ x' = x + F(<<1>>)
Init == x = 0
Next == Step(Len)
HasOp == "context" \in DOMAIN TLCGet("action")
Op == TLCGet("action").context.F
Inv == x < 2
EqualsNumber == HasOp => Op = 1
Compares == HasOp => {Op, Op} # {}
HasMember == HasOp => 1 \in Op
Applies == HasOp => Op[1] = 2
Prints == HasOp => PrintT(Op)
====
