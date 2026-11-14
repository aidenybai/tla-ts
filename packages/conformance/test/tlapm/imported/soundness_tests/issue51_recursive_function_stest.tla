(*---
description: tlapm's soundness test issue51_recursive_function_stest.tla states a false theorem, so an obligation must fail.
ref: test/soundness_tests/issue51_recursive_function_stest.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------- MODULE issue51_recursive_function_stest --------------

\* https://github.com/tlaplus/tlapm/issues/51
\* No function Silly on Nat satisfies Silly[n] = ~Silly[n], so the
\* recursive definition only determines Silly as some CHOOSE value.
\* Proving that Silly equals the defining function literal yields FALSE.
\* The old SMT encoding proved BuggyTheorem by rewriting
\* X = CHOOSE v : P(v) to (\E v : P(v)) => P(X).  The module is the
\* reproducer from the issue.

EXTENDS Naturals, TLAPS

DefSilly(Silly, n) == ~Silly[n]
Silly[n \in Nat] == DefSilly(Silly,n)

THEOREM BuggyTheorem == Silly = [n \in Nat |-> DefSilly(Silly,n)] BY DEF Silly
THEOREM FALSE
  <1> Silly[0] = ~Silly[0] BY BuggyTheorem DEF DefSilly
  <1> QED OBVIOUS

====================================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 24:67:24:69
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 24:67:24:69
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    (CHOOSE Silly : Silly = [n \in Nat |-> DefSilly(Silly, n)])
    = [n \in Nat |->
         DefSilly(CHOOSE Silly : Silly = [n_1 \in Nat |-> DefSilly(Silly, n_1)],
                  n)]

    @type: obligation
    @id: 2
    @loc: 27:11:27:18
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 27:11:27:18
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 3
    @loc: 26:28:26:30
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 26:28:26:30
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 4
    @loc: 26:31:26:43
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 26:31:26:43
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 4

    Zenon error: exhausted search space without finding a proof
    File "./issue51_recursive_function_stest.tla", line 24, characters 67-68:
    [ERROR]: Could not prove or check:
               ASSUME Silly ==
                        CHOOSE Silly : Silly = [n \in Nat |-> DefSilly(Silly, n)]
               PROVE  Silly = [n \in Nat |-> DefSilly(Silly, n)]
    File "./issue51_recursive_function_stest.tla", line 9, character 1 to line 29, character 68:
    [ERROR]: 1/4 obligations failed.
    There were backend errors processing module `"issue51_recursive_function_stest"`.
---*)
