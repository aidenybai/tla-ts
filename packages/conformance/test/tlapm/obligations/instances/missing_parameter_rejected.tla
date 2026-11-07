(*---
description: A parameter missing from WITH with no identifier of the same name in scope cannot be inferred, so tlapm rejects the module.
ref: src/module/m_elab.ml#complete_with_statement_params
includes: [Lib.tla]
mode: obligations
outcome: rejected
---*)
---- MODULE missing_parameter_rejected ----
CONSTANT c
VARIABLE x
I == INSTANCE Lib WITH k <- c
THEOREM TRUE
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./missing_parameter_rejected.tla", line 11, characters 6-29 :
    Required parameter v for module Lib could not be inferred.

    @type: error
    @url: http://tla.msr-inria.inria.fr/bugs
    @msg: Oops, this seems to be a bug in TLAPM.
    Please give feedback to developers.


     Failure("Module.Elab.complete_with_statement_params")

     tlapm ending abnormally with Failure("Module.Elab.complete_with_statement_params")
---*)
