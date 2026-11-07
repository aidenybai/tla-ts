(*---
description: A pragma applied to an argument that no @ consumes reports too many arguments.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: failed
---*)
---- MODULE custom_pragma_too_many_arguments ----
EXTENDS Naturals, TLAPS
MySmt(X) == TRUE (*{ by (prover:"smt") }*)
THEOREM \A x \in Nat : x + 0 = x
  BY MySmt(3)
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
    @prover: fail
    @meth: time-limit: inf
    @reason: unexpected error
    @already: false
    @obl: ASSUME MySmt(3) 
    PROVE  \A x \in Nat : x + 0 = x

    @type: obligation
    @id: 2
    @loc: 11:6:11:14
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    @type: warning
    @msg: File "./custom_pragma_too_many_arguments.tla", line 11, characters 6-13 :
    Too many arguments

    File "./custom_pragma_too_many_arguments.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME MySmt(3) 
               PROVE  \A x \in Nat : x + 0 = x
    File "./custom_pragma_too_many_arguments.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"custom_pragma_too_many_arguments"`.
---*)
