(*---
description: Inside the proof of an ASSUME step with a Now assumption the scope is Now, so the facts of its substeps are not boxed.
ref: src/proof/p_gen.ml#prove_assertion
args: ["--method", "ls4"]
mode: encoding
outcome: failed
---*)
---- MODULE assume_step_changes_scope ----
EXTENDS TLAPS
VARIABLE x, y
THEOREM ASSUME [](x = 0) PROVE TRUE
<1>1. ASSUME y = 1 PROVE [](x = 0)
  <2>1. x = 0
    BY PTL
  <2> QED
    BY ONLY <2>1, PTL
<1> QED
  BY PTL
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 18:3:18:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 18:3:18:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 18:6:18:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 18:6:18:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 16:5:16:7
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 16:5:16:7
    @status: failed
    @prover: ls4
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE x,
           NEW VARIABLE y,
           x = 0 (* non-[] *),
           TRUE (* non-[] *)
    PROVE  [](x = 0)

    @type: obligation
    @id: 4
    @loc: 16:13:16:17
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 16:13:16:17
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 5
    @loc: 16:19:16:22
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 16:19:16:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 6
    @loc: 14:5:14:7
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 14:5:14:7
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 7
    @loc: 14:8:14:11
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 14:8:14:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 7

    File "./assume_step_changes_scope.tla", line 16, characters 5-6:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      NEW VARIABLE y,
                      <2>1 ,
                      PTL 
               PROVE  [](x = 0)
    File "./assume_step_changes_scope.tla", line 8, character 1 to line 19, character 4:
    [ERROR]: 1/7 obligations failed.
    There were backend errors processing module `"assume_step_changes_scope"`.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory assume_step_changes_scope imports Constant Zenon begin
    ML_command \<open> writeln ("*** TLAPS PARSED\n"); \<close>
    consts
      "isReal" :: c
      "isa_slas_a" :: "[c,c] => c"
      "isa_bksl_diva" :: "[c,c] => c"
      "isa_perc_a" :: "[c,c] => c"
      "isa_peri_peri_a" :: "[c,c] => c"
      "isInfinity" :: c
      "isa_lbrk_rbrk_a" :: "[c] => c"
      "isa_less_more_a" :: "[c] => c"

    end

    --- ls4
    not (((always (always h4ca64)) -> h4ca64))

    --- ls4
    not (((always (always h4ca64)) & (always (cc | ~ cc)) -> (cc | ~ cc)))

    --- ls4
    not ((h4ca64 -> (always h4ca64)))
---*)
