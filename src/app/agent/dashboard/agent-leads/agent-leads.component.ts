import { Component, Directive, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { AgentUser } from '@app/_models';
import { AgentService } from '@app/_services';
import { ModalDismissReasons, NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { first } from 'rxjs/operators';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';

interface Leades {
  name: string;
  mobile: string;
  email: string;
  status: number;
  policy: string;

}
export interface SortEvent {
  column: SortColumn;
  direction: SortDirection;
}
export type SortColumn = keyof Leades | '';
export type SortDirection = 'asc' | 'desc' | '';
const rotate: {[key: string]: SortDirection} = { 'asc': 'desc', 'desc': '', '': 'asc' };

const compare = (v1: string | number, v2: string | number) => v1 < v2 ? -1 : v1 > v2 ? 1 : 0;

@Directive({
  selector: 'th[sortable]',
  host: {
    '[class.asc]': 'direction === "asc"',
    '[class.desc]': 'direction === "desc"',
    '(click)': 'rotate()'
  }
})

export class NgbdSortableHeader {

  @Input() sortable: SortColumn = '';
  @Input() direction: SortDirection = '';
  @Output() sort = new EventEmitter<SortEvent>();

  rotate() {
    this.direction = rotate[this.direction];
    this.sort.emit({column: this.sortable, direction: this.direction});
  }
}

@Component({
  selector: 'app-agent-leads',
  templateUrl: './agent-leads.component.html'
})
export class AgentLeadsComponent implements OnInit {
  leadDetails: any = [];
  agentuser: AgentUser;
  agentid: string;
  closeResult: string;
  myForm: FormGroup;
  message:string;
  page = 2;
  pageSize =10;
  @ViewChildren(NgbdSortableHeader) headers: QueryList<NgbdSortableHeader>;

  constructor(private agentService: AgentService,  
    private modalService: NgbModal,
    //public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder
    ) {
    this.agentuser = this.agentService.agentuserValue;
    this.agentid = this.agentuser.agentid;
    this.createForm();
  }

  private createForm() {
    this.myForm = this.formBuilder.group({
      leadname: ['', [Validators.required, Validators.minLength(10) , Validators.pattern('^[A-z]*((-|\s)*[A-z ])*$')]],
      leadmobile: ['', [Validators.required, Validators.pattern("^((\\+91-?)|0)?[0-9]{10}$")] ],
      leademail: ['', [Validators.required, Validators.email]],
      policytype: ['', [Validators.required, Validators.minLength(3) , Validators.maxLength(10), Validators.pattern('^[a-zA-Z]*$')]],
    });
  }
  get f() { return this.myForm.controls; }

  private submitForm() {
   const formData: FormData = new FormData();
   formData.append("name",this.myForm.value.leadname );
   formData.append("mobile",this.myForm.value.leadmobile);
   formData.append("email",this.myForm.value.leademail);
   formData.append("policy",this.myForm.value.policytype);
   formData.append("agentid",this.agentid);
   formData.append("status","0");

   this.agentService.addAgentLeade(formData)
   .pipe(first())
   .subscribe(leadDetails => {
      this.message ="Lead added sucesfully..";
      this.showLeadsDetail();
  } ,
    err => {
      this.message ="Having problem..Please try after some time.."
      this.showLeadsDetail();
    }
    
    );

   

   this.closeResult = `Dismissed ${this.getDismissReason("Submit")}`;
  }

  ngOnInit(): void {
      this.showLeadsDetail();
  }

  showLeadsDetail() {
    this.agentService.getAllAgentLeades(this.agentid)
      .pipe(first())
      .subscribe(leadDetails => {
        this.leadDetails =JSON.parse( leadDetails);
        //console.log(this.leadDetails)
      });
  }
  open(content) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      this.closeResult = `Dismissed ${this.getDismissReason(result)}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });

  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }



  onSort({column, direction}: SortEvent) {

    // resetting other headers
    this.headers.forEach(header => {
      if (header.sortable !== column) {
        header.direction = '';
      }
    });

    // sorting countries
    if (direction === '' || column === '') {
      this.leadDetails = this.leadDetails;
    } else {
      this.leadDetails = [...this.leadDetails].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

}
