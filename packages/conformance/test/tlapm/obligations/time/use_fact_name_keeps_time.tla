(*---
description: A USE of a named axiom in a Now scope gives the fact the time Now, so PTL cannot box the axiom. The lookup in Proof.Gen.gen_step keeps the time only of a fact or a proof definition, and the name of an axiom is a user definition, so it falls back to the scope's time although the axiom holds always (src/proof/p_gen.ml#gen_step).
ref: src/proof/p_gen.ml#gen_step
features: [tlapm-bug]
args: ["--method", "ls4"]
mode: encoding
outcome: failed
---*)
---- MODULE use_fact_name_keeps_time ----
EXTENDS TLAPS
VARIABLE x, y
AXIOM A == x = 0
THEOREM ASSUME y = 1 PROVE [](x = 0)
<1> USE A
<1> QED
  BY PTL
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 16:3:16:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 16:3:16:5
    @status: failed
    @prover: ls4
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE x,
           NEW VARIABLE y,
           y = 1 (* non-[] *),
           x = 0 (* non-[] *),
           TRUE (* non-[] *)
    PROVE  [](x = 0)

    @type: obligation
    @id: 2
    @loc: 16:6:16:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 16:6:16:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 14:9:14:10
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 14:9:14:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./use_fact_name_keeps_time.tla", line 16, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      NEW VARIABLE y,
                      A == x = 0,
                      y = 1 ,
                      A ,
                      PTL 
               PROVE  [](x = 0)
    File "./use_fact_name_keeps_time.tla", line 9, character 1 to line 17, character 4:
    [ERROR]: 1/3 obligations failed.
    There were backend errors processing module `"use_fact_name_keeps_time"`.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory use_fact_name_keeps_time imports Constant Zenon begin
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
    not ((hbdff3 & h4ca64 -> (always h4ca64)))
---*)
