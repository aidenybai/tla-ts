---- MODULE Encoder ----
EXTENDS Naturals, Sequences
VARIABLE x, y
CONSTANT c, S, T, Op(_)
Zenon == TRUE (*{ by (prover:"zenon") }*)
ExpandENABLED == TRUE (*{ by (prover:"expandenabled") }*)
D == x'
E == x' = x
F == [](x = 1)
G == c'
H == [][x' = x + 1]_x
I == UNCHANGED <<x, y>>
K == <><<x' = 2>>_y
L(a) == a' = a
M == [x' = 3]_<<x, y>>
Max(a, b) == IF a > b THEN a ELSE b
Rec == [f |-> 1, g |-> "str"]
Inc(v) == v' = v + 1
Step == Inc(x) /\ UNCHANGED y
THEOREM ASSUME D, F, G, H, I, K, L(x), L(c), M, [](y = 1), (x + 1)' = c PROVE E BY Zenon
THEOREM ASSUME NEW a \in S, NEW b \in S, a = b PROVE b = a BY Zenon
THEOREM ASSUME NEW n \in Nat PROVE Max(n, n) = n BY Zenon DEF Max
THEOREM Rec.f = 1 /\ "a\\b" # "a" BY Zenon DEF Rec
THEOREM ASSUME NEW r, NEW i PROVE [r EXCEPT ![i] = @ + 1, !.g = 3].g = 3 BY Zenon
THEOREM CASE c = 1 -> TRUE [] OTHER -> c # 1 BY Zenon
THEOREM LET k == c + 1 IN (CHOOSE q \in S : q = k) \in S \/ S = {} BY Zenon
THEOREM {Op(q) : q \in S} \cup {q \in T : q # c} = [q \in S |-> q][c] BY Zenon
THEOREM ASSUME x \in Nat, Step PROVE x' \in Nat /\ y' = y BY Zenon DEF Step, Inc
THEOREM ASSUME x = 0 PROVE ENABLED Step BY Zenon, ExpandENABLED DEF Step, Inc
THEOREM \A q \in S : \E r \in T : <<q, r>> \in S \X T /\ Len(<<q>>) = 1 BY Zenon
THEOREM [q \in S, r \in T |-> q] = [q \in S, r \in T |-> q] BY Zenon
====
