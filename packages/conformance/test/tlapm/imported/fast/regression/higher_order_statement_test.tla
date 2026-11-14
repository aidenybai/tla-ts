(*---
description: tlapm's own test fast/regression/higher_order_statement_test.tla.
ref: test/fast/regression/higher_order_statement_test.tla
features:
  - tlapm-test
mode: proof
outcome: incomplete
---*)
-------------- MODULE higher_order_statement_test ------------------
EXTENDS Integers, TLAPS

NatInductiveDefConclusion(f, f0, Def(_,_)) ==
     f = [i \in Nat |-> IF i = 0 THEN f0 ELSE Def(f[i-1], i)]
NatInductiveDefHypothesis(f, f0, Def(_,_)) ==
   (f =  CHOOSE g : g = [i \in Nat |-> IF i = 0 THEN f0 ELSE Def(g[i-1], i)])

THEOREM NatInductiveDef ==
          ASSUME NEW Def(_,_)
          PROVE  \A f, f0 : NatInductiveDefHypothesis(f, f0, Def)
                             => NatInductiveDefConclusion(f, f0, Def)
PROOF OMITTED

factorial[n \in Nat] == IF n = 0 THEN 1 ELSE n * factorial[n-1]

THEOREM \A n \in Nat : factorial[n] = IF n = 0 THEN 1 ELSE n * factorial[n-1]
<1>DEFINE Def(v, n) == n * v
<1>1. NatInductiveDefHypothesis(factorial, 1, Def)
  BY DEF NatInductiveDefHypothesis, factorial
<1>2. NatInductiveDefConclusion(factorial, 1, Def)
  BY <1>1, NatInductiveDef, Isa
<1>2bis. NatInductiveDefConclusion(factorial, 1, Def)
  BY <1>1, NatInductiveDef, ZenonT(30)
<1>3. QED
  BY <1>2 DEF NatInductiveDefConclusion
=============================================================================

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 34:3:34:5
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 34:3:34:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 3
    @loc: 34:6:34:10
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 34:6:34:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 28:3:28:5
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 28:3:28:5
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 5
    @loc: 30:3:30:5
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 30:3:30:5
    @status: proved
    @prover: isabelle
    @meth: auto; time-limit: 30
    @already: false

    @type: obligation
    @id: 6
    @loc: 30:6:30:10
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 30:6:30:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 7
    @loc: 30:12:30:27
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 30:12:30:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 8
    @loc: 30:29:30:32
    @status: to be proved

    @type: obligation
    @id: 8
    @loc: 30:29:30:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 9
    @loc: 32:3:32:5
    @status: to be proved

    @type: obligation
    @id: 9
    @loc: 32:3:32:5
    @status: proved
    @prover: zenon
    @meth: time-limit: 30
    @already: false

    @type: obligation
    @id: 10
    @loc: 32:6:32:10
    @status: to be proved

    @type: obligation
    @id: 10
    @loc: 32:6:32:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 11
    @loc: 32:12:32:27
    @status: to be proved

    @type: obligation
    @id: 11
    @loc: 32:12:32:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 12
    @loc: 32:29:32:39
    @status: to be proved

    @type: obligation
    @id: 12
    @loc: 32:29:32:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 11

    Omitted proof at File "./higher_order_statement_test.tla", line 21, characters 7-13
    File "./higher_order_statement_test.tla", line 9, character 1 to line 35, character 77:
    [ERROR]: Proof incomplete in module "higher_order_statement_test": 0 missing, 1 omitted proof step(s).
    File "./higher_order_statement_test.tla", line 9, character 1 to line 35, character 77:
    [INFO]: All 11 obligations proved.
---*)
