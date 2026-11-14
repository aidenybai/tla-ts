(*---
description: tlapm's own test medium/regression/select_bug_test.tla, which checks nostd* ending abnormally.
ref: test/medium/regression/select_bug_test.tla
features:
  - tlapm-test
mode: proof
outcome: incomplete
---*)
--------------------------- MODULE select_bug_test ----------------------------
EXTENDS Naturals, TLAPS

LEMMA
  ASSUME NEW CONSTANT Def(_, _), NEW CONSTANT P(_),
         P(0),
         \A n \in Nat : P(n)  =>  P(n  +  1),
         ASSUME NEW CONSTANT P_1(_),
                P_1(0),
                \A n \in Nat : P_1(n)  =>  P_1(n  +  1)
         PROVE  \A n \in Nat : P_1(n)
  PROVE  \A n \in Nat : P(n)
PROOF OMITTED

THEOREM FiniteNatInductiveDef ==
  ASSUME NEW Def(_,_)
  PROVE  \A n \in Nat: \A f, f0 :
              (f =  CHOOSE g : g = [i \in 0..n |-> IF i = 0
                                                   THEN f0
                                                   ELSE Def(g[i-1], i)])
              => /\ f = [i \in 0..n |-> IF i = 0 THEN f0
                                                 ELSE Def(f[i-1], i)]
                 /\ \A h : (h = [i \in 0..n |-> IF i = 0 THEN f0
                                                         ELSE Def(h[i-1], i)])
                           => (h = f)
PROOF OMITTED

LEMMA
  ASSUME NEW Def(_,_)
  PROVE  /\ TRUE
         /\ \A n \in Nat: \A f, f0 :
              (f =  CHOOSE g : g = [i \in 0..n |-> IF i = 0
                                                   THEN f0
                                                   ELSE Def(g[i-1], i)])
              => /\ f = [i \in 0..n |-> IF i = 0 THEN f0
                                                 ELSE Def(f[i-1], i)]
                 /\ \A h : (h = [i \in 0..n |-> IF i = 0 THEN f0
                                                         ELSE Def(h[i-1], i)])
                           => (h = f)
BY FiniteNatInductiveDef


=============================================================================

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 3
    @loc: 48:1:48:3
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 48:1:48:3
    @status: proved
    @prover: isabelle
    @meth: auto; time-limit: 30
    @already: false

    @type: obligation
    @id: 4
    @loc: 48:4:48:25
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 48:4:48:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    Omitted proof at File "./select_bug_test.tla", line 21, characters 7-13
    Omitted proof at File "./select_bug_test.tla", line 34, characters 7-13
    File "./select_bug_test.tla", line 9, character 1 to line 51, character 77:
    [ERROR]: Proof incomplete in module "select_bug_test": 0 missing, 2 omitted proof step(s).
    File "./select_bug_test.tla", line 9, character 1 to line 51, character 77:
    [INFO]: All 2 obligations proved.
---*)
