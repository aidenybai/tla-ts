(*---
description: "The fact of HAVE [](x = 0) is box-closed, so it has the time Always."
ref: src/proof/p_simplify.ml#simplify_step
args: ["--method", "ls4"]
mode: encoding
outcome: proved
---*)
---- MODULE have_box_always ----
EXTENDS TLAPS
VARIABLE x
THEOREM [](x = 0) => [][](x = 0)
<1> HAVE [](x = 0)
<1> QED
  BY PTL
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
    @loc: 12:1:12:19
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 12:1:12:19
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 4
    @loc: 12:1:12:19
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 12:1:12:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 4

    File "./have_box_always.tla", line 8, character 1 to line 15, character 4:
    [INFO]: All 4 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory have_box_always imports Constant Zenon begin
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
    not (((always ((always (always h4ca64)) -> (always (always h4ca64)))) -> ((always h4ca64) -> (always (always h4ca64)))))

    --- ls4
    not (((always (always h4ca64)) & (always (cc | ~ cc)) -> (always (always h4ca64))))
---*)
