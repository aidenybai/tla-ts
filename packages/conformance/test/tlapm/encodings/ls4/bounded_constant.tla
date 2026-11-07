(*---
description: A NEW constant with a bound gets a separate membership fact before encoding.
ref: src/frontend/pltl.ml#process_eob
mode: encoding
outcome: proved
---*)
---- MODULE bounded_constant ----
EXTENDS Naturals, TLAPS
VARIABLE x, y
THEOREM ASSUME NEW S, NEW c \in S, [](x = c) PROVE x = c
  BY PTL
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

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

    File "./bounded_constant.tla", line 7, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory bounded_constant imports Constant Zenon begin
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
    not (((always h64394) & (always (always had79b)) & (always (cc | ~ cc)) -> had79b))
---*)
