(*---
description: Isabelle also proves an instance of NatInduction cited in BY.
ref: library/NaturalsInduction.tla#NatInduction
mode: proof
outcome: proved
---*)
---- MODULE nat_induction_isabelle ----
EXTENDS Naturals, NaturalsInduction, TLAPS
THEOREM ASSUME NEW Q(_), Q(0), \A n \in Nat : Q(n) => Q(n + 1) PROVE \A n \in Nat : Q(n)
  BY NatInduction, Isa
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: proved
    @prover: isabelle
    @meth: auto; time-limit: 30
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:18
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 10:20:10:23
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 10:20:10:23
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./nat_induction_isabelle.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 3 obligations proved.
---*)
