---- MODULE RecursiveOperators ----
EXTENDS Naturals, Sequences, FiniteSets
VARIABLES log, applied, total

RECURSIVE AppendFrom(_, _, _, _)
AppendFrom(entries, state, from, to) ==
  IF from > to
  THEN state
  ELSE LET next == Append(state, entries[from])
       IN AppendFrom(entries, next, from + 1, to)

RECURSIVE SetSum(_)
SetSum(set) ==
  IF set = {} THEN 0 ELSE LET x == CHOOSE x \in set : TRUE IN x + SetSum(set \ {x})

Init == log = <<>> /\ applied = <<>> /\ total = 0

Next ==
  \/ /\ Len(log) < 4
     /\ \E value \in 1..2 : log' = Append(log, value)
     /\ UNCHANGED <<applied, total>>
  \/ /\ Len(applied) < Len(log)
     /\ \E to \in Len(applied) + 1..Len(log) :
          applied' = AppendFrom(log, applied, Len(applied) + 1, to)
     /\ total' = SetSum({applied[i] * i : i \in DOMAIN applied})
     /\ UNCHANGED log
====
