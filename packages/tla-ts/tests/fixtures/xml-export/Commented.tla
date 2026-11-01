---- MODULE Commented ----
EXTENDS Counted
VARIABLE count

(***************************************************************************)
(* The count starts below the limit.                                       *)
(***************************************************************************)
Init == count = 0

\* The count grows
\*   while it stays below the limit.
Next == Below(count) /\ count' = count + 1
====
