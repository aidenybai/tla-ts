---- MODULE LiteralValues ----
EXTENDS Integers, Sequences, TLC

VARIABLES x, y

Sorted(i) == [a |-> 1, b |-> 2]
Written(i) == [b |-> 1, a |-> 2]
Pair(i) == <<1, 2>>
Empty(i) == <<>>

Init == x = Empty(0) /\ y = Sorted(0)

Next ==
  /\ x' = CASE x = Empty(0) -> Pair(0)
            [] x = Pair(0) -> <<3>>
            [] OTHER -> Empty(0)
  /\ y' = y

Literals ==
  /\ y = Sorted(0)
  /\ [Sorted(0) EXCEPT !.a = 5].a = 5
  /\ Sorted(0).a = 1
  /\ [Pair(0) EXCEPT ![1] = 5][1] = 5
  /\ Pair(0)[1] = 1
  /\ Pair(0) \o <<3>> = <<1, 2, 3>>
  /\ Append(Pair(0), 3) = <<1, 2, 3>>
  /\ Pair(0) = <<1, 2>>
  /\ Tail(<<1>>) = Empty(0)
  /\ Append(Empty(0), 1) = <<1>>
  /\ Empty(0) = <<>>
  /\ Len(Empty(0)) = 0
  /\ ToString(Sorted(0)) = "[a |-> 1, b |-> 2]"
  /\ ToString(Written(0)) = "[b |-> 1, a |-> 2]"
  /\ Written(0) = [a |-> 2, b |-> 1]
  /\ ToString(Written(0)) = "[b |-> 1, a |-> 2]"
  /\ ToString(Written(1)) = "[b |-> 1, a |-> 2]"
====
