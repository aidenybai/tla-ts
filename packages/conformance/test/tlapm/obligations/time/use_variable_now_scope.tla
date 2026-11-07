(*---
description: A USE of a variable, which names no fact, gives the new fact the time of the current scope, here Now, as fixed in 94ee425.
ref: src/proof/p_gen.ml#gen_step
args: ["--method", "ls4"]
mode: encoding
outcome: failed
---*)
---- MODULE use_variable_now_scope ----
EXTENDS TLAPS
VARIABLE b
THEOREM ASSUME b PROVE []b
<1> USE b
<1> QED
  BY PTL
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 14:3:14:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 14:3:14:5
    @status: failed
    @prover: ls4
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE b,
           b (* non-[] *),
           b (* non-[] *),
           TRUE (* non-[] *)
    PROVE  []b

    @type: obligation
    @id: 2
    @loc: 14:6:14:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 14:6:14:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 12:9:12:10
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 12:9:12:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./use_variable_now_scope.tla", line 14, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE b,
                      b ,
                      b ,
                      PTL 
               PROVE  []b
    File "./use_variable_now_scope.tla", line 8, character 1 to line 15, character 4:
    [ERROR]: 1/3 obligations failed.
    There were backend errors processing module `"use_variable_now_scope"`.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory use_variable_now_scope imports Constant Zenon begin
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
    not ((h9f153 & h9f153 -> (always h9f153)))
---*)
