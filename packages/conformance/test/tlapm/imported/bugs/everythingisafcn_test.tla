(*---
description: tlapm's own test bugs/everythingisafcn_test.tla, which checks stderr status:failed.
ref: test/bugs/everythingisafcn_test.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
---- MODULE everythingisafcn_test ----

EXTENDS TLAPS

(** Functions in TLA+ are guarded by a predicate IsAFcn to separate them from
    other values.  IsAFcn occurs in the axioms of TLA+ only.  If the condition
    IsAFcn is dropped, the theory of TLA+ makes the statement "Everything is a
    function" valid.
*)

THEOREM \A f : \E a, b : f \in [ a -> b ]
<1> TAKE f
<1> DEFINE a == DOMAIN f
<1> DEFINE b == { f[x] : x \in a }
<1>1 f \in [ a -> b ]
    <2>1 DOMAIN f = a
        (*OBVIOUS*)
    <2>2 \A x \in a : f[x] \in b
        (*OBVIOUS*)
    <2> QED
        BY ONLY <2>1, <2>2
<1> QED
    (*BY ONLY <1>1*)

====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 20:1:20:11
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 20:1:20:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 3
    @loc: 20:1:20:11
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 20:1:20:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 29:9:29:11
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 29:9:29:11
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW CONSTANT f,
           DOMAIN f = DOMAIN f ,
           \A x \in DOMAIN f : f[x] \in {f[x_1] : x_1 \in DOMAIN f} 
    PROVE  f \in [DOMAIN f -> {f[x] : x \in DOMAIN f}]

    @type: obligation
    @id: 5
    @loc: 29:17:29:21
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 29:17:29:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 6
    @loc: 29:23:29:27
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 29:23:29:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 5

    Missing proof at File "./everythingisafcn_test.tla", line 24, characters 5-21
    Missing proof at File "./everythingisafcn_test.tla", line 26, characters 5-32
    Missing proof at File "./everythingisafcn_test.tla", line 30, characters 1-7
    File "./everythingisafcn_test.tla", line 9, character 1 to line 33, character 4:
    [ERROR]: Proof incomplete in module "everythingisafcn_test": 3 missing, 0 omitted proof step(s).
    File "./everythingisafcn_test.tla", line 29, characters 9-10:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT f,
                      a == DOMAIN f,
                      b == {f[x] : x \in a},
                      <2>1 ,
                      <2>2 
               PROVE  f \in [a -> b]
    File "./everythingisafcn_test.tla", line 9, character 1 to line 33, character 4:
    [ERROR]: 1/5 obligations failed.
    There were backend errors processing module `"everythingisafcn_test"`.
---*)
