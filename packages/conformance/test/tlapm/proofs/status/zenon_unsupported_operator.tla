(*---
description: Zenon cannot encode -+->, so the obligation fails with Unsupported operator as its reason.
ref: src/backend/zenon.ml#pp_apply
mode: proof
outcome: failed
---*)
---- MODULE zenon_unsupported_operator ----
EXTENDS TLAPS
VARIABLE x
THEOREM (x = 1 -+-> x = 2) => TRUE
  BY Zenon
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: failed
    @prover: zenon
    @meth: time-limit: 10
    @reason: Unsupported operator `-+->`.
    @already: false
    @obl: 
    ASSUME NEW VARIABLE x,
           TRUE 
    PROVE  x = 1 -+-> x = 2 => TRUE

    @type: obligation
    @id: 2
    @loc: 11:6:11:11
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./zenon_unsupported_operator.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      Zenon 
               PROVE  x = 1 -+-> x = 2 => TRUE
    File "./zenon_unsupported_operator.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"zenon_unsupported_operator"`.
---*)
