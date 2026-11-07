(*---
description: A step label may contain letters, as in <1>a, and the step is cited by that name.
ref: src/alexer.mll#token
mode: obligations
outcome: proved
---*)
---- MODULE step_label_letters ----
THEOREM TRUE
<1>a. TRUE
  OBVIOUS
<1>b. TRUE
  BY <1>a
<1> QED
  BY <1>b
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 14:3:14:5
    @status: to be proved
    @obl: ASSUME <1>b 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 14:6:14:10
    @status: to be proved
    @obl: <1>b

    @type: obligation
    @id: 3
    @loc: 10:3:10:10
    @status: to be proved
    @obl: TRUE

    @type: obligation
    @id: 4
    @loc: 12:3:12:5
    @status: to be proved
    @obl: ASSUME <1>a 
    PROVE  TRUE

    @type: obligation
    @id: 5
    @loc: 12:6:12:10
    @status: to be proved
    @obl: <1>a

    @type: obligationsnumber
    @count: 5
---*)
