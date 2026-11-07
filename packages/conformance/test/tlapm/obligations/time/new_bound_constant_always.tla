(*---
description: "The bound of NEW c \\in {k} for a constant k becomes a fact c \\in {k} with the time Always, computed in the context that holds c, as fixed in efe4f2d."
ref: src/frontend/pltl.ml
args: ["--method", "ls4"]
mode: encoding
outcome: proved
---*)
---- MODULE new_bound_constant_always ----
EXTENDS TLAPS
CONSTANT k
VARIABLE x
THEOREM ASSUME NEW c \in {k} PROVE [](c \in {k})
  BY PTL
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:3:13:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 13:3:13:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 13:6:13:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 13:6:13:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./new_bound_constant_always.tla", line 8, character 1 to line 14, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory new_bound_constant_always imports Constant Zenon begin
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
    not (((always h340eb) & (always (cc | ~ cc)) -> (always h340eb)))
---*)
