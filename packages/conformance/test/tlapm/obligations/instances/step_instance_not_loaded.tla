(*---
description: A module instantiated only inside a proof step is never loaded, so tlapm ends with Module "Lib" unknown. Module.Dep.external_deps looks for INSTANCE only in the hypotheses of each module unit, which leave out proofs (src/module/m_dep.ml#external_deps).
ref: src/module/m_dep.ml#external_deps
features: [tlapm-bug]
includes: [Lib.tla]
mode: obligations
outcome: rejected
---*)
---- MODULE step_instance_not_loaded ----
CONSTANT c
VARIABLE x
THEOREM c = c
<1> I == INSTANCE Lib WITH k <- c, v <- x
<1> QED
  BY DEF I!Op
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./step_instance_not_loaded.tla", line 13, characters 7-41 :
    Module "Lib" unknown

    @type: error
    @url: http://tla.msr-inria.inria.fr/bugs
    @msg: Oops, this seems to be a bug in TLAPM.
    Please give feedback to developers.


     Failure("Module.Elab.anon#defns")

     tlapm ending abnormally with Failure("Module.Elab.anon#defns")
---*)
