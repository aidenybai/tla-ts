---- MODULE GeneratedBindings ----
EXTENDS Naturals, Sequences, FiniteSets
VARIABLE x

IsEven(n) == n % 2 = 0
Select(test(_), seq) == SelectSeq(seq, test)
Size(set) == Cardinality(set)
Pair(left, right) == {left, right}
Lowest(set) == {low \in set : \A other \in set : low <= other + x * 0}
Sum(n) == LET next == n + x IN \E total \in 0..next : total = next
Unused(ignored, used) == used

Init == x = 0
Next == x < 3 /\ x' = x + 1

Invariant ==
  /\ Select(IsEven, <<1, 2, x + x, 3>>) = <<2, x + x>>
  /\ Size({x, x + 1}) = 2
  /\ {"b", "a", "b"} = {"a", "b"}
  /\ Cardinality({"b", "a", "b"}) = 2
  /\ Pair(x, x + 1) = Pair(x + 1, x)
  /\ Cardinality(Pair(x, x)) = 1
  /\ Lowest(0..x) = {0}
  /\ Sum(x)
  /\ Unused(1 \div 0, x) = x
====
