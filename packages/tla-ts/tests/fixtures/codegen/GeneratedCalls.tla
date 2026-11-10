---- MODULE GeneratedCalls ----
EXTENDS Naturals, TLC
VARIABLES x, y

First(a, b) == a
Pass(a, b) == First(a, b)
PassBoth(a, b) == Pass(b, a)
Primed(v) == v'
PrimedLet(v) == LET w == v' IN w
LetBody(a) == LET c == a + 1 IN c * 2
Reachable == x >= 0
InQuantifier(a) == \A q \in {a} : q = a /\ Reachable
Higher(F(_), v) == F(v)
Inc(v) == v + 1
Twice(v) == v + v
RECURSIVE Sum(_)
Sum(n) == IF n = 0 THEN 0 ELSE n + Sum(n - 1)
RECURSIVE Depth(_)
Depth(n) == IF n = 0 THEN 0 ELSE LET d == Depth(n - 1) IN d + 1
RECURSIVE Even(_), Odd(_)
Even(n) == IF n = 0 THEN TRUE ELSE LET o == Odd(n - 1) IN o
Odd(n) == IF n = 0 THEN FALSE ELSE LET e == Even(n - 1) IN e
Rec == [a |-> 1, b |-> 2]
Fcn == [s \in {"a", "b"} |-> 3]
Set(p) == {p, p + 1}
InSet(p) == \E q \in Set(p) : q = p + 1
Mapped(p) == [i \in {p} |-> i + x]

Init == x = 0 /\ y = 0
Next == /\ x < 3
        /\ x' = First(x + 1, CHOOSE z \in {} : TRUE)
        /\ y' = Pass(LetBody(x), 1 \div 0)
        /\ Primed(x) = x + 1
        /\ PrimedLet(x) = x + 1
        /\ PassBoth(CHOOSE z \in {} : TRUE, x) = x
        /\ \E x2 \in {x} : First(x2, x2 \div 0) = x /\ InQuantifier(x2)
        /\ Sum(3) = 6
        /\ Depth(3) = 3
        /\ Even(4) /\ Odd(3)
        /\ Higher(Inc, x) = x + 1
        /\ Twice(x + 1) = 2 * (x + 1)
        /\ Rec.a + Rec.b = 3
        /\ Fcn.a = 3
        /\ InSet(x)
        /\ Mapped(x)[x] = x + x
Spec == Init /\ [][Next]_<<x, y>>
====
