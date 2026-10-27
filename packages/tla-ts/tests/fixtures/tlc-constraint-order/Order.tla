---- MODULE Order ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x \in {0, 1, 0}
Next == x < 3 /\ x' \in {x, x + 1}
Constraint == PrintT(<<"constraint", x, TLCGet("level")>>)
ActionConstraint == PrintT(<<"action constraint", x, x', TLCGet("level")>>)
Inv == PrintT(<<"invariant", x, TLCGet("level")>>)
Prop == [][PrintT(<<"property", x, x'>>)]_x
====
