(*---
description: A step label may contain digits and underscores after the level, as in <1>x_2.
ref: src/alexer.mll#token
mode: obligations
outcome: proved
---*)
---- MODULE step_label_underscore ----
THEOREM TRUE
<1>x_2. TRUE
  OBVIOUS
<1> QED
  BY <1>x_2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: to be proved
    @obl: ASSUME <1>x_2 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 12:6:12:12
    @status: to be proved
    @obl: <1>x_2

    @type: obligation
    @id: 3
    @loc: 10:3:10:10
    @status: to be proved
    @obl: TRUE

    @type: obligationsnumber
    @count: 3
---*)
