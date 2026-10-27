--------------------------- MODULE Specifications ---------------------------
CONSTANT P

VARIABLE x

Init(S) == x \in S

Next(S) == x' \in S

SpecOf(S) == Init(S) /\ [][Next(S)]_x

Argument == SpecOf(P)

Nested(S) == SpecOf(S)

Twice == Nested(P)

R(S) == INSTANCE SpecificationsInner WITH y <- x

Instance == R(P)!Spec

Local == LET Q == P IN SpecOf(Q)

ForallFair == Init(P) /\ [][Next(P)]_x /\ \A p \in P : WF_x(Next({p}))

InsideForall == \A p \in P : Init({p}) /\ [][Next({p})]_x

InsideExists == \E p \in P : Init({p}) /\ [][Next({p})]_x

ForallInit == (\A p \in P : Init({p}) /\ WF_x(Next({p}))) /\ [][Next(P)]_x

ForallNext == Init(P) /\ \A p \in P : [][Next({p})]_x

TemporalExists == \EE y : Init(P) /\ [][Next(P)]_x

TemporalForall == \AA y : Init(P) /\ [][Next(P)]_x

Inv == x \in P

Visits == \A p \in P : []<>(x = p)
=============================================================================
