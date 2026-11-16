(*---
description: A USE of an expression in an Always scope gives the new fact the time Always, by necessitation.
ref: src/proof/p_gen.ml#gen_step
args: ["--method", "ls4"]
mode: encoding
outcome: proved
---*)
---- MODULE use_expression_always_scope ----
EXTENDS TLAPS
VARIABLE x
THEOREM ASSUME [](x = 0) PROVE [](x = 0)
<1> USE x = 0
<1> QED
  BY ONLY x = 0, PTL
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 14:3:14:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 14:3:14:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 14:11:14:16
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 14:11:14:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 14:18:14:21
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 14:18:14:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 12:9:12:14
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 12:9:12:14
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 4

    File "./use_expression_always_scope.tla", line 8, character 1 to line 15, character 4:
    [INFO]: All 4 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory use_expression_always_scope imports Constant Zenon begin
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
    not (((always h4ca64) & (always (cc | ~ cc)) -> (always h4ca64)))
---*)
