---- MODULE Statistics ----
EXTENDS Naturals, TLC
VARIABLE x
S(label) == LET s == TLCGet("stats") IN
  PrintT(<<label, x, TLCGet("level"), s.queue, s.distinct, s.generated, s.initial, s.diameter>>)
SI(label) == LET s == TLCGet("stats") IN
  PrintT(<<label, TLCGet("level"), s.queue, s.distinct, s.generated, s.initial, s.diameter>>)
Init == x \in {0, 1, 0, 2} /\ SI("init")
Next == /\ x < 6
        /\ S("next-pre")
        /\ x' \in {x + 1, x + 2, x}
        /\ S("next-post")
        /\ PrintT(<<"primed", TLCGet("level")'>>)
Inv == S("inv")
Constraint == S("constraint") /\ x # 5
ActionConstraint == S("action-constraint") /\ x' # 3
Prop == [][S("prop")]_x
====
