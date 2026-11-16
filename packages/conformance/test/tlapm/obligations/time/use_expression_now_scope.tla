(*---
description: A USE of an expression in a Now scope gives the new fact the time Now.
ref: src/proof/p_gen.ml#gen_step
args: ["--method", "ls4"]
mode: encoding
outcome: failed
---*)
---- MODULE use_expression_now_scope ----
EXTENDS TLAPS
VARIABLE x, y
THEOREM ASSUME [](x = 0), y = 1 PROVE [](x = 0)
<1> USE ONLY x = 0
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
    ASSUME NEW VARIABLE x,
           NEW VARIABLE y,
           x = 0 (* non-[] *),
           TRUE (* non-[] *)
    PROVE  [](x = 0)

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
    @loc: 12:14:12:19
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 12:14:12:19
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./use_expression_now_scope.tla", line 14, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      NEW VARIABLE y,
                      x = 0 ,
                      PTL 
               PROVE  [](x = 0)
    File "./use_expression_now_scope.tla", line 8, character 1 to line 15, character 4:
    [ERROR]: 1/3 obligations failed.
    There were backend errors processing module `"use_expression_now_scope"`.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory use_expression_now_scope imports Constant Zenon begin
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
    not (((always (always h4ca64)) & hbdff3 -> h4ca64))

    --- ls4
    not ((h4ca64 -> (always h4ca64)))
---*)
