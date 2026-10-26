----------------------------- MODULE Semantics -----------------------------
EXTENDS Integers, Sequences, FiniteSets, TLC

VARIABLE unused

ASSUME 2 + 3 * 4 = 14
ASSUME 2 ^ 10 = 1024
ASSUME (-7) \div 2 = -4
ASSUME (-7) % 2 = 1
ASSUME -7 \div 2 = -3
ASSUME -7 % 2 = 1
ASSUME 7 % 3 = 1
ASSUME 63 = \b111111 /\ 63 = \o77 /\ 63 = \h3F /\ 63 = \B111111 /\ 63 = \O77 /\ 63 = \H3f
ASSUME -3 + 5 = 2
ASSUME - (3 - 5) = 2
ASSUME 1..3 = {3, 2, 1, 2}
ASSUME 3..1 = {}
ASSUME {1, 2} \cup {2, 3} = 1..3
ASSUME {1, 2, 3} \cap {2, 3, 4} = {2, 3}
ASSUME {1, 2, 3} \ {2} = {1, 3}
ASSUME {1} \subseteq {1, 2} /\ ~({3} \subseteq {1, 2})
ASSUME 3 \in Nat \ {0} /\ 0 \notin Nat \ {0}
ASSUME (Nat \cap {-1, 2}) = {2} /\ ({-1, 2} \cap Nat) = {2}
ASSUME -1 \in Nat \cup {-1} /\ -2 \notin Nat \cup {-1}
ASSUME {1, -2} \ Nat = {-2}
ASSUME 2 \in Nat /\ -2 \notin Nat /\ -2 \in Int
ASSUME SUBSET {1, 2} = {{}, {1}, {2}, {1, 2}}
ASSUME UNION {{1}, {2, 3}} = {1, 2, 3}
ASSUME Cardinality(SUBSET (1..4)) = 16
ASSUME Cardinality([1..3 -> 1..4]) = 64 /\ Cardinality([{} -> {}]) = 1 /\ Cardinality([1..2 -> {}]) = 0
ASSUME Cardinality([a : 1..3, b : 1..5]) = 15 /\ Cardinality((1..3) \X {} \X (1..4)) = 0
ASSUME Cardinality(SUBSET SUBSET (1..4)) = 65536
ASSUME {x * x : x \in 1..3} = {1, 4, 9}
ASSUME {x \in 1..10 : x % 3 = 0} = {3, 6, 9}
ASSUME 3 \in {n \in Nat : n > 2} /\ 2 \notin {n \in Nat : n > 2}
ASSUME [j \in {1} |-> 4] \in [{1} -> {n \in Int : n % 2 = 0}]
ASSUME {<<x, y>> : x \in 1..2, y \in {"a"}} = {<<1, "a">>, <<2, "a">>}
ASSUME (1..2) \X {"a", "b"} = {<<1, "a">>, <<1, "b">>, <<2, "a">>, <<2, "b">>}
ASSUME \A x \in 1..3 : x > 0
ASSUME \E x \in 1..3 : x = 2
ASSUME ~\E x \in {} : TRUE
ASSUME \A x, y \in 1..3 : x + y >= 2
ASSUME \E <<x, y>> \in (1..2) \X (1..2) : x + y = 4
ASSUME (CHOOSE x \in 1..10 : x > 3) = 4
ASSUME IF 1 < 2 THEN TRUE ELSE FALSE
ASSUME CASE 1 > 2 -> FALSE [] 2 > 1 -> TRUE [] OTHER -> FALSE
ASSUME (CASE 1 > 2 -> 1 [] OTHER -> 2) = 2
ASSUME LET double(n) == n * 2
           four == double(2)
       IN four = 4
ASSUME [x \in 1..3 |-> x * 2][2] = 4
ASSUME DOMAIN [x \in {"a", "b"} |-> 0] = {"a", "b"}
ASSUME [x \in 1..2 |-> x] = <<1, 2>>
ASSUME [first |-> 1, second |-> 2].second = 2
ASSUME [first |-> 1, second |-> 2] = [second |-> 2, first |-> 1]
ASSUME [[a |-> 1] EXCEPT !.a = @ + 1].a = 2
ASSUME [<<1, 2, 3>> EXCEPT ![2] = 20] = <<1, 20, 3>>
ASSUME [[a |-> <<1, 2>>] EXCEPT !.a[1] = 9] = [a |-> <<9, 2>>]
ASSUME [[a |-> 1, b |-> 2] EXCEPT !.a = 3, !.b = 4] = [a |-> 3, b |-> 4]
ASSUME [x \in 1..2, y \in 1..2 |-> x + y][2, 1] = 3
ASSUME [{1, 2} -> {"a"}] = {<<"a", "a">>}
ASSUME Cardinality([1..3 -> BOOLEAN]) = 8
ASSUME [kind : {"a", "b"}, size : {1}] = {[kind |-> "a", size |-> 1], [kind |-> "b", size |-> 1]}
ASSUME <<1, 2>> \in [1..2 -> Nat]
ASSUME [a |-> 1] \in [a : Nat]
ASSUME <<1, 2>> \o <<3>> = <<1, 2, 3>>
ASSUME Len(<<"a", "b", "c">>) = 3
ASSUME Append(<<1>>, 2) = <<1, 2>>
ASSUME Head(<<4, 5>>) = 4 /\ Tail(<<4, 5>>) = <<5>>
ASSUME SubSeq(<<1, 2, 3, 4>>, 2, 3) = <<2, 3>>
ASSUME SubSeq(<<1, 2, 3>>, 3, 2) = <<>>
ASSUME SelectSeq(<<1, 2, 3, 4>>, LAMBDA n : n % 2 = 0) = <<2, 4>>
ASSUME <<1, 2>> \in Seq({1, 2}) /\ <<3>> \notin Seq({1, 2})
ASSUME Cardinality({1, 2, 2, 3}) = 3
ASSUME IsFiniteSet({1, 2})
ASSUME (1 :> "a" @@ 2 :> "b") = <<"a", "b">>
ASSUME (1 :> "a" @@ 1 :> "b")[1] = "a"
ASSUME ToString(<<1, "a">>) = "<<1, \"a\">>"
ASSUME Permutations({1, 2}) = {<<1, 2>>, <<2, 1>>}
ASSUME SortSeq(<<3, 1, 2>>, <) = <<1, 2, 3>>
ASSUME "abc" = "abc" /\ "abc" # "abd"
ASSUME {"b", "a"} = {"a", "b"}
ASSUME BOOLEAN = {TRUE, FALSE}
ASSUME (TRUE => FALSE) = FALSE /\ (FALSE => FALSE)
ASSUME (TRUE <=> TRUE) /\ ~(TRUE <=> FALSE)
ASSUME {{1, 2}, {2, 1}} = {{1, 2}}
ASSUME <<>> = [x \in {} |-> 0]

RECURSIVE Sum(_)
Sum(set) == IF set = {} THEN 0 ELSE LET element == CHOOSE x \in set : TRUE IN element + Sum(set \ {element})
ASSUME Sum(1..4) = 10

Factorial[n \in Nat] == IF n = 0 THEN 1 ELSE n * Factorial[n - 1]
ASSUME Factorial[5] = 120
ASSUME LET depth[n \in 0..500] == IF n = 0 THEN 0 ELSE depth[n - 1] + 1 IN depth[500] = 500
ASSUME LET sum[s \in SUBSET (1..4)] == IF s = {} THEN 0 ELSE LET e == CHOOSE e \in s : TRUE IN e + sum[s \ {e}] IN sum[1..4] = 10

Shadow(Later) == Later[1]
Later == [n \in 1..2 |-> 0]
ASSUME Shadow([n \in 1..2 |-> n + 1]) = 2

Apply(F(_), value) == F(value)
Increment(n) == n + 1
ASSUME Apply(Increment, 1) = 2
ASSUME Apply(LAMBDA n : n * 10, 2) = 20

Labeled == \/ P0:: 1 = 2
           \/ P1:: \A n \in {1, 2} : lab(n) :: n > 0
ASSUME Labeled

a (+) b == a + b + 1
ASSUME 1 (+) 2 = 4

Init == unused = 0
Next == UNCHANGED unused
=============================================================================
