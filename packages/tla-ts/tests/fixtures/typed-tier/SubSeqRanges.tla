---- MODULE SubSeqRanges ----
EXTENDS Naturals, Sequences
VARIABLES log, other
Init == log = <<1>> /\ other = <<1>>
Next ==
  /\ Len(log) < 3
  /\ SubSeq(log, 1, 2) = SubSeq(other, 1, 2)
  /\ log' = Append(log, 1)
  /\ other' = Append(other, 1)
====
