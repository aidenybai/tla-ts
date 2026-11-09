---- MODULE SparseMissing ----
EXTENDS Naturals, TLC
VARIABLES log, next
Init == log = <<>> /\ next = 1
Next ==
  \/ next <= 3 /\ log' = log @@ (next :> next) /\ next' = next + 1
  \/ next = 4 /\ log' = log @@ (5 :> log[4]) /\ next' = 5
====
