import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomValidation } from '@app/_helpers';
import { AlertService, AgentposService, CacheService, CustomService } from '@app/_services';
import { Observable } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

@Component({
  templateUrl: './agentpos.component.html',
})


export class AgentposComponent implements OnInit, OnDestroy {

  _session: Object;
  agentRegiform: FormGroup;
  loading = false;
  submitted = false;
  cacheService = CacheService;
  pincodeDetails: any =[]; 
  public model: any;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private agentposService: AgentposService,
    private alertService: AlertService,
    private customValidator: CustomValidation
  ) {  }
  // convenience getter for easy access to form fields
  get f() { return this.agentRegiform.controls; }

  ngOnInit(): void {

    this.agentRegiform = this.formBuilder.group({
      agentemail: ['', [Validators.required, Validators.email, Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]],
      agentphone: ['', [Validators.required, Validators.pattern("^((\\+91-?)|0)?[0-9]{10}$"), Validators.minLength(10)]],
      pincode: ['', [Validators.required, Validators.minLength(6)]]
    });
    //cache part
    if (sessionStorage.getItem("agentinfo")) {
      this.agentRegiform.setValue(JSON.parse(sessionStorage.getItem("agentinfo")));
    }
 }
 search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(1300),
      map(term =>  this.pincodeDetails)
    )
    formatter = (x: {Pincode: string}) => x.Pincode  
    onkeyPressval(term:string) { 
        if(term.length < 4) return;
        this.agentposService.getAllPincode(term).subscribe(pincodeData=> {        
          //  console.log(pincodeData)
          this.pincodeDetails = pincodeData;
          this.pincodeDetails = JSON.parse(this.pincodeDetails);
       
        })
    }
  onSubmit() {
    this.submitted = true;

    // reset alerts on submit
    this.alertService.clear();

    // stop here if form is invalid
    if (this.agentRegiform.invalid) {
      return;
    }
    //debugger;
    this.loading = true;

    this.alertService.success('Please complete your KYC to Registration successful. ', { keepAfterRouteChange: true });
    this._session = this.agentRegiform.value;
    sessionStorage.setItem("agentinfo", JSON.stringify(this.agentRegiform.value));
    //console.log(sessionStorage)
    this.router.navigate(['../agentkyc'], { queryParams: { value: this._session['agentphone'] } });


  }
  public ngOnDestroy(): void {
    //console.log("Destroy..")
    // sessionStorage.removeItem("agentinfo");
    // console.log(sessionStorage.getItem("agentinfo"))
    // delete sessionStorage.agentinfo;

  }
}
