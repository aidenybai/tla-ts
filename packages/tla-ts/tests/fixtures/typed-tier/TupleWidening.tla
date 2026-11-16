---- MODULE TupleWidening ----
EXTENDS Naturals, Sequences
VARIABLES other, t
Init == other = <<1, "a">> /\ t = <<1, 2>>
Next == /\ t[2] > 0
        /\ t' = Tail(t)
        /\ UNCHANGED other
====
