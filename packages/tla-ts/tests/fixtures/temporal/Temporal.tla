---- MODULE Temporal ----
EXTENDS Naturals

VARIABLES x, y

vars == <<x, y>>

Init == x = 0 /\ y = 0

Up == x < 3 /\ x' = x + 1 /\ UNCHANGED y

Down == x > 0 /\ x' = x - 1 /\ UNCHANGED y

Flip == y' = 1 - y /\ UNCHANGED x

Next == Up \/ Down \/ Flip

Spec == Init /\ [][Next]_vars

WeakSpec == Spec /\ WF_vars(Up) /\ WF_vars(Flip)

StrongSpec == Spec /\ SF_vars(Up) /\ WF_vars(Flip)

AssumedSpec == Spec /\ []<>(x = 3) /\ []<>(y = 1)

QuantifiedSpec == Spec /\ \A action \in {"up", "flip"} :
  WF_vars(IF action = "up" THEN Up ELSE Flip)

OnceTopThenNever == [](x = 3 => [](x # 3))

NeverTopAfterBottom == [](x = 1 => [](x # 3))

EventuallyStaysTop == <>[](x = 3)

OftenTop == []<>(x = 3)

TopThenBottom == <>(x = 3 /\ <>(x = 0))

OftenTopImpliesOftenFlip == []<>(x = 3) => []<><<Flip>>_vars

TopLeadsToStaying == (x = 3) ~> [](x = 3)

TopLeadsToFlip == [](x = 3 => <><<Flip>>_vars)

RECURSIVE Visits(_)
Visits(n) == IF n = 0 THEN <>(x = 3) ELSE <>(x = n /\ Visits(n - 1))

VisitsInOrder == Visits(2)

OftenFlipped == []<>(y = 1)

FlipFollowsZero == (y = 0) ~> (y = 1)

SettlesOrFalls == <>[](x = 3) \/ []<><<Down>>_vars

EventuallyBounded == <>[](x <= 3)

Tautology == <>[]TRUE => TRUE

Mixed == [](x # 7) /\ <>(x = 3) /\ [][x' # x + 2]_vars
====
