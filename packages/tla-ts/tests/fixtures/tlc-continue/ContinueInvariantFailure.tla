---- MODULE ContinueInvariantFailure ----
EXTENDS Integers

VARIABLE y

Init == y = [a |-> 1]

Next == y' \in {r \in [a : 0..4] : 10 \div (r.a - 5) # 99}

Inv == 2 \div y.a > 0
====
