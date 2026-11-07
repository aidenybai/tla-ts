(*---
description: Zenon receives the second-order NatInduction as a first-order A. over P that applies P as a function, so it cannot instantiate P with the declared operator Q and gives up.
ref: src/backend/zenon.ml#pp_print_sequent
mode: proof
outcome: failed
---*)
---- MODULE nat_induction_zenon ----
EXTENDS Naturals, NaturalsInduction, TLAPS
THEOREM ASSUME NEW Q(_), Q(0), \A n \in Nat : Q(n) => Q(n + 1) PROVE \A n \in Nat : Q(n)
  BY NatInduction, Zenon
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: failed
    @prover: zenon
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW CONSTANT Q(_),
           Q(0) ,
           \A n \in Nat : Q(n) => Q(n + 1) ,
           ASSUME NEW CONSTANT P(_),
                  P(0) ,
                  \A n \in Nat : P(n) => P(n + 1) 
           PROVE  \A n \in Nat : P(n) ,
           TRUE 
    PROVE  \A n \in Nat : Q(n)

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
    @loc: 10:20:10:25
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 10:20:10:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    Zenon error: exhausted search space without finding a proof
    File "./nat_induction_zenon.tla", line 10, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT Q(_),
                      Q(0) ,
                      \A n \in Nat : Q(n) => Q(n + 1) ,
                      NatInduction ,
                      Zenon 
               PROVE  \A n \in Nat : Q(n)
    File "./nat_induction_zenon.tla", line 7, character 1 to line 11, character 4:
    [ERROR]: 1/3 obligations failed.
    There were backend errors processing module `"nat_induction_zenon"`.
---*)
