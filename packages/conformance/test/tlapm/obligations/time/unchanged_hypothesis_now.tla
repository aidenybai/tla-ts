(*---
description: An UNCHANGED hypothesis is expanded before its time is computed and is action-level, so it has the time Now.
ref: src/expr/e_temporal_props.ml#compute_time
args: ["--method", "ls4"]
mode: encoding
outcome: failed
---*)
---- MODULE unchanged_hypothesis_now ----
EXTENDS TLAPS
VARIABLE x
THEOREM ASSUME UNCHANGED x PROVE [](UNCHANGED x)
  BY PTL
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: failed
    @prover: ls4
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE x,
           UNCHANGED x (* non-[] *),
           TRUE (* non-[] *)
    PROVE  []UNCHANGED x

    @type: obligation
    @id: 2
    @loc: 12:6:12:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 12:6:12:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./unchanged_hypothesis_now.tla", line 12, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      UNCHANGED x ,
                      PTL 
               PROVE  []UNCHANGED x
    File "./unchanged_hypothesis_now.tla", line 8, character 1 to line 13, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"unchanged_hypothesis_now"`.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory unchanged_hypothesis_now imports Constant Zenon begin
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
    not ((h0d12a -> (always h0d12a)))
---*)
