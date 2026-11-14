(*---
description: WITH may only substitute the declared parameters of the instantiated module, so substituting a definition is rejected.
ref: src/module/m_elab.ml#assert_instance_substitutes_declared_identifiers
includes: [Lib.tla]
mode: obligations
outcome: rejected
---*)
---- MODULE substitute_non_parameter_rejected ----
CONSTANT c
VARIABLE x
I == INSTANCE Lib WITH k <- c, v <- x, Op <- c
THEOREM TRUE
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./substitute_non_parameter_rejected.tla", line 11, characters 40-41 :
    Parameter Op occurs in the statement `INSTANCE Lib WITH`, and is not declared in the module Lib

    @type: error
    @url: http://tla.msr-inria.inria.fr/bugs
    @msg: Oops, this seems to be a bug in TLAPM.
    Please give feedback to developers.


     Failure("Module.Elab.instance_substitutes_declared_identifiers")

     tlapm ending abnormally with Failure("Module.Elab.instance_substitutes_declared_identifiers")
---*)
