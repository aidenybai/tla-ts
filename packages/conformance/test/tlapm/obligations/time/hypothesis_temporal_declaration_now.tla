(*---
description: A hypothesis that is a NEW TEMPORAL formula F is not box-closed, so it has the time Now.
ref: src/expr/e_temporal_props.ml#box_closure
args: ["--method", "ls4"]
mode: encoding
outcome: failed
---*)
---- MODULE hypothesis_temporal_declaration_now ----
EXTENDS TLAPS
THEOREM ASSUME NEW TEMPORAL F, F PROVE []F
  BY PTL
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: failed
    @prover: ls4
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW TEMPORAL F,
           F (* non-[] *),
           TRUE (* non-[] *)
    PROVE  []F

    @type: obligation
    @id: 2
    @loc: 11:6:11:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./hypothesis_temporal_declaration_now.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW TEMPORAL F,
                      F ,
                      PTL 
               PROVE  []F
    File "./hypothesis_temporal_declaration_now.tla", line 8, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"hypothesis_temporal_declaration_now"`.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory hypothesis_temporal_declaration_now imports Constant Zenon begin
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
    not ((hcb5c1 -> (always hcb5c1)))
---*)
