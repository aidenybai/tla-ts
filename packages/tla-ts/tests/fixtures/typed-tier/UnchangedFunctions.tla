---- MODULE UnchangedFunctions ----
EXTENDS Naturals
VARIABLES count, flag
vars == <<count, flag>>
Init == count = 0 /\ flag = FALSE
Next ==
  \/ count < 2 /\ count' = count + 1 /\ UNCHANGED flag
  \/ flag' = ~flag /\ count' = 0
Spec == Init /\ [][Next]_vars
\* Flipping the flag also resets the count, which this property forbids.
Stable == [][LET counts[index \in {1}] == count IN UNCHANGED counts[1]]_flag
====
