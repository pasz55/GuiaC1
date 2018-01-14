 (function() {


function toggleVisibility(id) {
  var el = document.getElementById(id);

  if(el.style.display == 'none')
    el.style.display = 'block';
  else
    el.style.display = 'none';
}

function removeClass(el, className) {
    if (el.classList) el.classList.remove(className);
    else el.className = el.className.replace(new RegExp('\\b'+ className+'\\b', 'g'), '');
}

var canvas = document.getElementsByClassName('layout_baguera_10_canvas')[0];
var context = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var Projectile;
var State = false;
var Explode = false;
var Collapse = false;
var Particles = [];


function Proj() {
  this.radius = 5.2;
  this.x = Math.random() * canvas.width;
  this.y = canvas.height + this.radius;
  this.color =  rgb2hex(window.getComputedStyle(document.getElementById('layout_baguera_10_Button'), null).getPropertyValue("background-color"));
  this.velocity = {x: 0, y: 0};
  this.speed = 12;
}

Proj.prototype = {
  Update: function () {
    if(this.x > (canvas.width / 2) && this.x - (canvas.width / 2) <= 10 || this.x < (canvas.width / 2) && (canvas.width / 2) - this.x <= 10) {
      Explode = true;
      document.getElementById('layout_baguera_10_Nav').className = 'layout_baguera_10_active';
    } else {
      this.dx = (canvas.width / 2) - this.x;
      this.dy = (canvas.height / 2) - this.y;
      this.distance = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
      this.velocity.x = (this.dx/this.distance) * this.speed;
      this.velocity.y = (this.dy/this.distance) * this.speed;
      this.x += this.velocity.x;
      this.y += this.velocity.y;
    }
  },

  Draw: function () {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.color;
    context.fill();
    context.closePath();
  }
};

function rgb2hex(rgb) {
 rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
 return (rgb && rgb.length === 4) ? "#" +
  ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
}

function Particle() {
  this.x = canvas.width / 2;
  this.y = canvas.height / 2;
  this.radius = 4;
  this.color =  rgb2hex(window.getComputedStyle(document.getElementById('layout_baguera_10_Button'), null).getPropertyValue("background-color"));
  this.velocity = {x: (Math.random() < 0.5 ? -1 : 1) * Math.random() * 10, y: (Math.random() < 0.5 ? -1 : 1) * Math.random() * 10};
  this.speed = 25;
  this.active = true;
}

Particle.prototype = {
  Update: function () {
    if(Collapse) {
      this.dx = (canvas.width / 2) - this.x;
      this.dy = (canvas.height / 2) - this.y;
      this.distance = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
      this.velocity.x = (this.dx/this.distance) * this.speed;
      this.velocity.y = (this.dy/this.distance) * this.speed;
      this.x += this.velocity.x;
      this.y += this.velocity.y;

      if(this.x > (canvas.width / 2) && this.x - (canvas.width / 2) <= 15 || this.x < (canvas.width / 2) && (canvas.width / 2) - this.x <= 15) {
        if(this.y > (canvas.height / 2) && this.y - (canvas.height / 2) <= 15 || this.y < (canvas.height / 2) && (canvas.height / 2) - this.y <= 15) {
          this.active = false;
        }
      }
    } else {
      this.x += this.velocity.x;
      this.y += this.velocity.y;
    }
  },

  Draw: function () {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.lineWidth = 2.2;
    context.strokeStyle = this.color;
    context.stroke();
    context.closePath();
  }
};

function Update () {
  if(Particles.length < 100) {
    for(var x = Particles.length; x < 100; x++) {
      Particles.push(new Particle());
    }
  }

  if(Explode || Collapse) {
    Particles.forEach(function(particle) {
      particle.Update();
    });
  }

  Particles = Particles.filter(function(particle) {
    return particle.active;
  });

  if(State && !Explode) {
    Projectile.Update();
  }

  Render();
  requestAnimationFrame(Update);
}

function Render () {
  var bc_color = document.getElementById("layout_baguera_10_feat-0").style.backgroundColor;
  document.getElementById("layout_baguera_10_Button").style.color = bc_color;
  context.clearRect(0, 0, canvas.width, canvas.height);

  if(Collapse || Explode) {
    Particles.forEach(function(particle) {
      particle.Draw();
    });
  }

  if(State && !Explode) {
    Projectile.Draw();
  }
}

document.getElementById('layout_baguera_10_Button').addEventListener('click', function ()
{
  State = !State;

  if(Explode && State == false) {
    Collapse = true;
  } else {
    Collapse = false;
    Particles = [];
  }

  if(State) {
    Projectile = new Proj();
  } else {
    Projectile = null;
    Explode = false;
  }

  if(!State) {
    document.getElementById('layout_baguera_10_Nav').className = '';
  }

  toggleVisibility("layout_baguera_10_menu_remove");
  toggleVisibility("layout_baguera_10_menu_icon");
});

document.addEventListener('DOMContentLoaded', function(){
  //Update();
  // not fucking fired in previewer....
  // console.log('DOMContentLoaded');
});

Update();

window.addEventListener('resize', function(event) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

})();
