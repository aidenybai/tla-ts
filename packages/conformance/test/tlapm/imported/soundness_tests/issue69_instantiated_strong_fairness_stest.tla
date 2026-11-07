(*---
description: tlapm's soundness test issue69_instantiated_strong_fairness_stest.tla states a false theorem, so an obligation must fail.
ref: test/soundness_tests/issue69_instantiated_strong_fairness_stest.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------- MODULE issue69_instantiated_strong_fairness_stest --------------

\* https://github.com/tlaplus/tlapm/issues/69
\* Strong fairness variant of the lemma XY!Fair <=> WF_(XY!vars)(XY!Next)
\* in issue69_instantiated_fairness_stest.  In I!Fair, ENABLED binds x' and
\* y' before the substitution x <- z, y <- z, whereas in SF_(I!vars)(I!Next)
\* it binds z' after.  For z = 0 forever, I!Fair is FALSE and
\* SF_(I!vars)(I!Next) is TRUE, so the theorem is false.

EXTENDS Integers, TLAPS

VARIABLE z

---- MODULE Inner ----
EXTENDS Integers
VARIABLES x, y
Next == x' = x + 1 /\ y' = y - 1
vars == <<x, y>>
Fair == SF_vars(Next)
====

I == INSTANCE Inner WITH x <- z, y <- z

THEOREM I!Fair <=> SF_(I!vars)(I!Next)
BY DEF I!Fair

==============================================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 33:1:33:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 33:1:33:3
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE z
    PROVE  ([]<>?EnabledWrapper(LAMBDA r#0, r#1 :
                                  r#1 = z + 1 /\ r#0 = z - 1
                                  /\ ~(/\ r#1 = z
                                       /\ r#0 = z))
            => []<><<I!Next>>_I!vars)
           <=> (SF_(I!vars) (I!Next))

    @type: obligationsnumber
    @count: 0

    @type: obligationsnumber
    @count: 1

    File "./issue69_instantiated_strong_fairness_stest.tla", line 27, characters 17-20:
    [INFO]: Auto-expanding the definition of operator:  Next
    File "./issue69_instantiated_strong_fairness_stest.tla", line 27, characters 9-15:
    [INFO]: Auto-expanding the definition of operator:  vars
    File "./issue69_instantiated_strong_fairness_stest.tla", line 22, character 1 to line 28, character 4:
    [INFO]: All 0 obligation proved.
    File "./issue69_instantiated_strong_fairness_stest.tla", line 33, characters 1-2:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE z,
                      I!Fair ==
                        []<>?EnabledWrapper
                              (LAMBDA r#0, r#1 :
                                 r#1 = z + 1 /\ r#0 = z - 1
                                 /\ ~(/\ r#1 = z
                                      /\ r#0 = z))
                        => []<><<I!Next>>_I!vars
               PROVE  I!Fair <=> (SF_(I!vars) (I!Next))
    File "./issue69_instantiated_strong_fairness_stest.tla", line 9, character 1 to line 35, character 78:
    [ERROR]: 1/1 obligation failed.
    There were backend errors processing module `"issue69_instantiated_strong_fairness_stest"`.
---*)
