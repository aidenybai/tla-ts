(*---
description: tlapm's own test fast/regression/cooper_instantiation_test.tla, which checks stderr status:failed; nostderr status:proved.
ref: test/fast/regression/cooper_instantiation_test.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
-----------  MODULE cooper_instantiation_test ---------------
EXTENDS Integers

THEOREM SimpleArithmetic == TRUE (*{ by (cooper) }*)

THEOREM ASSUME NEW CONSTANT XXX,
        NEW CONSTANT i \in Int
        PROVE  XXX  \in  Int
BY SimpleArithmetic
====================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 17:1:17:3
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 17:1:17:3
    @status: failed
    @prover: cooper
    @meth: time-limit: inf
    @already: false
    @obl: 
    \* Cooper's method is not available any more.

    ASSUME NEW CONSTANT CONSTANT_XXX_,
           NEW CONSTANT CONSTANT_i_ \in Int
    PROVE  CONSTANT_XXX_ \in Int

    @type: obligation
    @id: 3
    @loc: 17:4:17:20
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 17:4:17:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    Missing proof at File "./cooper_instantiation_test.tla", line 12, character 53
    File "./cooper_instantiation_test.tla", line 9, character 1 to line 18, character 36:
    [ERROR]: Proof incomplete in module "cooper_instantiation_test": 1 missing, 0 omitted proof step(s).
    Cooper's method is not available any more.
    File "./cooper_instantiation_test.tla", line 17, characters 1-2:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT XXX,
                      NEW CONSTANT i \in Int,
                      SimpleArithmetic 
               PROVE  XXX \in Int
    File "./cooper_instantiation_test.tla", line 9, character 1 to line 18, character 36:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"cooper_instantiation_test"`.
---*)
